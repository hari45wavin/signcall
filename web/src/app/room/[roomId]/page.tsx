import { notFound } from "next/navigation";
import { isValidRoomId } from "@/lib/roomId";
import { RoomGate } from "@/components/lobby/RoomGate";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ host?: string }>;
}) {
  const { roomId } = await params;
  const { host } = await searchParams;
  if (!isValidRoomId(roomId)) notFound();
  return <RoomGate roomId={roomId} host={host === "1"} />;
}
