import MinecraftServerListPing from "./MinecraftServerListPing.js";

export default async function getMcStat() {
  try {
    return await MinecraftServerListPing.ping(4, "147.185.221.20", 16321, 3000);
    // MinecraftServerListPing.ping(4, "mc.hypixel.net", 25565, 3000)
  } catch {
    return null;
  }
}
