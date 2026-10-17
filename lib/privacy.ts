/**
 * Public pages show only a building or area, never a room number (SPEC §11). Flags things like
 * "Room 312", "rm 4B", "#210", "apt 3", "unit 12", or any 3+ digit number.
 */
export function looksLikeRoomNumber(text: string): boolean {
  return (
    /\b(room|rm|apt|apartment|unit|suite|ste|dorm\s*room)\.?\s*#?\s*\d/i.test(text) ||
    /#\s*\d/.test(text) ||
    /\d{3,}/.test(text)
  );
}

export const ROOM_NUMBER_MESSAGE =
  "Just the building or area, please — no room numbers. You'll share exact details in private chat.";
