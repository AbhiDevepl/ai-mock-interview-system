process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "test-project";
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || "test@test.iam.gserviceaccount.com";
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCkukrVOXDwYiP4\nw27ouu+yKoA1fiqEvUgIMEppzfYxf9nFlq9ea5S3LzokIXaFUIdlc5y7RZaIjYTD\nqnsVH283R8FOaebmGwVHITeZ4O83xpE5LMxVAS+9taqIOoLrbZPV5P9bZvD6+Jzr\nfwVkI3rg7qFVSWuiQ+bzDEqzqYs1zgk8pRZEyLEdVD27cA8d3ItAUs4p06aIx5qs\nilvJDay4QVlHvDa4alOvroHkRyJWS2zqfXo4TZZYoOpjwrOyqsG+GAn3W/ur7SXz\nSjFqD1HO7pMUF8ESmSpxJ6/+tBI+WzUIqtEACg8xdThdpLGYY3lWMFw4r1RqbzLk\nsKUEexKRAgMBAAECggEAQ4Z+QJPQYSnJ1yK95zciJOXZMpRqd4lj6r9o8aBVSItB\nSQbxEoKFLuZ0LfVtsU6Ggib3W6k2APoKL29GDy2YmI+YhT1SQodXDYZnVXPoe/Ow\n+kAL7tiSqnC63CcoHbwIewjpSJ2VMTwSj1K9cgQ9TdFkXyK+tYCiPoWOZcGdaEtJ\n2qVky6rEDik2U4Qw0ZyqzfHiWzPO8uGy+RvumKhEwEwdwa6kra7LmDA68CAfFO8z\ngy8JPIyYubaAfrpvLTioy8TV8PZSVihgk5WDZDI4w50+/crkrkzyYAdK/KkT8Pw+\ntjCnK589CET/qquC+T48AmRgXIwCgxjxbLrXDPxn9QKBgQDXzf+qAA0AqtQBWaKi\nAMLSu1rb5zTWNlRj7vRyEbTGfzSTElh2cRjRfE8RSCfxLngxbqbcnqghyUV7ChBh\nwpCeF6ih4ISOBYCdq0rvc4KEZvrNCmqdJp89/TmJ1YntDnSzqmv4KjFPd5gCID/z\nexvMFGSscNXzEZj3yEHRWgoUkwKBgQDDaNcweP69JAkZG5iwV/Keac3QsDQpjkb7\nI0C00HyD6jxaSJi4VnSmPW/vADSovt5eHlLj95rnaV803jCyPhcNOVloF1WjhfEf\nhyVRNmOqXnh9T6ZZ37TP3Z74rcCV2+FczP1SQLsivQSYq1kyXM8GrpEkXFj3FjIA\nPkSw7Jt2ywKBgQC4FaDhAuoUh6QRAsUYLE4ENI1sx+zqTa3vEQazxybNq/TM//k2\nD4N8Lu3DcCmiMmGUyS7NQwloyKfcLNmMisuSD9xpOXvZKhhsZpGlcIMFLlMCVMBd\nDXUJC9jpGp5s+MfT+qvfJR6rCvk/1wK2T22GyF6YOihHD9vMgaajTosKwQKBgQC/\n42ANNYPRcGWOxk62PGb/sJ5vY9iVRiXlz8RmyqS7VXVWoxt1SVDbPlGAvQ749hWf\nDuAPBMKUpCDd5aKkJdy1G6/0S5XJMmqJr0ix61sLniFrzJ9qegcwaE0HnngTsQwo\n+RN5hh8+CadN1FWO4xxZT2sv7Y9fc+g93OfPZUl06QKBgQC+4tfP78QNJZc5HvMY\ntkqCTvwfAe3rWaPhTe5/ILzLM2YnaIBQb+Zi6KCeTYJAE7ZAQecPI+sH71hea5CP\nFTENK4Sl3/TDsZOLZb7gBZoyt9AgaaRaIAcqjx+ZbDH9RxIcTeQaGU/V0Cb6qoAl\nqQBeH1rFTQcKWdWiSuAUjFRI3w==\n-----END PRIVATE KEY-----";

/** @type {import('jest').Config} */
export default {
  transform: {},
  testEnvironment: "node",
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  globals: {},
};
