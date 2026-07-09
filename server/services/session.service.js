export const createSession = async (userId, deviceId, sessionData) => {
  return true;
};

export const deleteSession = async (userId, deviceId) => {
  return true;
};

export const generateDeviceId = (req) => {
  return "test-device-id";
};

export const blacklistJti = async (jti, ttl) => {
  return true;
};

export const recordLoginAttempt = async (email) => {
  return true;
};

export const isLoginBlocked = async (email) => {
  return false;
};
