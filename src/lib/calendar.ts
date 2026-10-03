import * as Calendar from "expo-calendar";
import { Alert } from "react-native";
import { eventEnd } from "./event-status";

export async function addEventToCalendar(event: {
  title: string;
  description: string;
  venue: string;
  date: string;
  endDate?: string;
  timeZone?: string;
}): Promise<boolean> {
  try {
    const permission = await Calendar.requestCalendarPermissions();
    if (!permission.granted) {
      Alert.alert(
        "Calendar permission needed",
        "Allow calendar access to save events to your device.",
      );
      return false;
    }

    const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
    const writable = calendars.find((c) => c.allowsModifications);

    if (!writable) {
      Alert.alert(
        "No calendar found",
        "There's no writable calendar on this device.",
      );
      return false;
    }

    const start = new Date(event.date);
    const end = eventEnd(event);

    await writable.createEvent({
      title: event.title,
      startDate: start,
      endDate: end,
      timeZone: event.timeZone,
      location: event.venue,
      notes: event.description,
    });

    Alert.alert(
      "Added to calendar",
      `"${event.title}" is now in your calendar.`,
    );
    return true;
  } catch {
    Alert.alert(
      "Couldn't add to calendar",
      "Check calendar permissions and try again in an installed StudentSync build.",
    );
    return false;
  }
}
