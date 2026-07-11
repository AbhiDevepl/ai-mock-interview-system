import { v4 as uuidv4 } from "uuid";
export const createSession = async (userId, deviceId, data) => true;
export const deleteSession = async (userId, deviceId) => true;
export const generateDeviceId = (req) => uuidv4();
export const blacklistJti = async (jti, ttl) => true;
export const recordLoginAttempt = async (email) => true;
export const isLoginBlocked = async (email) => false;
