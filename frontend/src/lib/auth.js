import {
  CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute,
} from "amazon-cognito-identity-js";

const userPool = new CognitoUserPool({
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
});

export async function signUp({ email, password, name, phone }) {
  const attrs = [
    new CognitoUserAttribute({ Name: "email", Value: email }),
    new CognitoUserAttribute({ Name: "name", Value: name }),
  ];
  if (phone) attrs.push(new CognitoUserAttribute({ Name: "phone_number", Value: phone }));
  return new Promise((res, rej) => {
    userPool.signUp(email, password, attrs, null, (err, result) => err ? rej(err) : res(result));
  });
}

export async function confirmSignUp(email, code) {
  const user = new CognitoUser({ Username: email, Pool: userPool });
  return new Promise((res, rej) => {
    user.confirmRegistration(code, true, (err, result) => err ? rej(err) : res(result));
  });
}

export async function signIn(email, password) {
  const user = new CognitoUser({ Username: email, Pool: userPool });
  const auth = new AuthenticationDetails({ Username: email, Password: password });
  return new Promise((res, rej) => {
    user.authenticateUser(auth, { onSuccess: res, onFailure: rej });
  });
}

export function signOut() {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
}

export async function getSession() {
  const user = userPool.getCurrentUser();
  if (!user) return null;
  return new Promise((res, rej) => {
    user.getSession((err, session) => {
      if (err || !session?.isValid()) return res(null);
      res(session);
    });
  });
}

export async function getToken() {
  try {
    const session = await getSession();
    return session?.getIdToken()?.getJwtToken() || null;
  } catch { return null; }
}

export async function getCurrentUser() {
  const user = userPool.getCurrentUser();
  if (!user) return null;
  return new Promise((res, rej) => {
    user.getSession((err, session) => {
      if (err || !session?.isValid()) return res(null);
      user.getUserAttributes((err, attrs) => {
        if (err) return rej(err);
        const profile = {};
        attrs.forEach(a => { profile[a.Name] = a.Value; });
        res(profile);
      });
    });
  });
}
