import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from "amazon-cognito-identity-js";

const pool = new CognitoUserPool({
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
});

export const cognitoSignUp = (email, password, name) =>
  new Promise((resolve, reject) => {
    const attrs = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "name", Value: name }),
    ];
    pool.signUp(email, password, attrs, null, (err, result) => {
      if (err) reject(err); else resolve(result);
    });
  });

export const cognitoConfirm = (email, code) =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.confirmRegistration(code, true, (err, result) => {
      if (err) reject(err); else resolve(result);
    });
  });

export const cognitoLogin = (email, password) =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.authenticateUser(new AuthenticationDetails({ Username: email, Password: password }), {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error("NEW_PASSWORD_REQUIRED")),
    });
  });

export const cognitoLogout = () => { const u = pool.getCurrentUser(); if (u) u.signOut(); };

export const cognitoGetSession = () =>
  new Promise((resolve, reject) => {
    const user = pool.getCurrentUser();
    if (!user) return reject(new Error("No user"));
    user.getSession((err, session) => {
      if (err || !session?.isValid()) return reject(err || new Error("Invalid session"));
      resolve(session);
    });
  });

export const cognitoGetUser = () =>
  new Promise(async (resolve, reject) => {
    try {
      const session = await cognitoGetSession();
      const payload = session.getIdToken().decodePayload();
      resolve({
        userId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split("@")[0],
        token: session.getIdToken().getJwtToken(),
      });
    } catch (e) { reject(e); }
  });

export const cognitoForgotPassword = (email) =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.forgotPassword({ onSuccess: resolve, onFailure: reject });
  });

export const cognitoConfirmPassword = (email, code, newPassword) =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.confirmPassword(code, newPassword, { onSuccess: resolve, onFailure: reject });
  });

export const cognitoResendCode = (email) =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool });
    user.resendConfirmationCode((err, result) => {
      if (err) reject(err); else resolve(result);
    });
  });
