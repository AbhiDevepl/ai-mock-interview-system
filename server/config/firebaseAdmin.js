export const admin = {
  auth: () => ({
    verifyIdToken: async (token) => ({
      email: "test@example.com",
      email_verified: true,
      uid: "test-uid",
    }),
  }),
};
