import * as Calendar from "expo-calendar";
import { Alert } from "react-native";

export async function addEventToCalendar(event: {
  title: string;
  description: string;
  venue: string;
  date: string;
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
    const writable =
      calendars.find((c) => c.allowsModifications) ?? calendars[0];

    if (!writable) {
      Alert.alert(
        "No calendar found",
        "There's no writable calendar on this device.",
      );
      return false;
    }

    // The API exposes no end time, so mirror the backend's .ics default of 2h.
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    await writable.createEvent({
      title: event.title,
      startDate: start,
      endDate: end,
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
      "Calendar access requires a development build — it isn't available in Expo Go.",
    );
    return false;
  }
}
