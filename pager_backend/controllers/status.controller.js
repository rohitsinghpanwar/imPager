import redisClient from "../realtime/redisClient.js";
export const getUserStatus = async (req, res) => {
    const { userId } = req.params;
    const status = await redisClient.get(userId);
    res.json({ userId, status: status || "offline" });
  };