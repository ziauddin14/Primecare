import { NotificationEventType, NotificationPayload } from "./types";
import clientPromise from "@/lib/mongodb";

/**
 * NotificationManager handles the triggering of clinical events.
 * It's structured as a modular event hub for future SaaS integrations 
 * (SMS, Email, WhatsApp, Push).
 */
export class NotificationManager {
  /**
   * Triggers a notification event.
   * Currently, it simply logs the event and prepares a database record for traceability.
   * This is where you would plug in Twilio, SendGrid, etc. in a SaaS context.
   */
  static async trigger(event: NotificationEventType, payload: NotificationPayload) {
    console.log(`[NotificationManager][${event}] triggered for appointment ${payload.appointmentId}`);
    
    // In a multi-tenant SaaS, this log would include clinicId 
    // to allow each clinic to monitor their messaging usage/costs.
    const logEntry = {
      event,
      appointmentId: payload.appointmentId,
      patientId: payload.patientId,
      patientName: payload.patientName,
      status: "QUEUED", // Mocking queue system
      payload,
      triggeredAt: new Date(),
      channel: this.getPreferredChannel(event),
    };

    try {
      const client = await clientPromise;
      const db = client.db();
      await db.collection("notification_logs").insertOne(logEntry);

      // Perform actual dispatch here in future steps
      await this.dispatch(event, payload);
    } catch (err) {
      console.error("[NotificationManager] Error persisting notification log:", err);
    }
  }

  private static getPreferredChannel(event: NotificationEventType) {
    // Logic for deciding which channel (SMS/Email) to use based on event
    switch(event) {
       case NotificationEventType.APPOINTMENT_REQUESTED: return "EMAIL";
       case NotificationEventType.APPOINTMENT_CONFIRMED: return "WHATSAPP";
       default: return "SMS";
    }
  }

  private static async dispatch(event: NotificationEventType, payload: NotificationPayload) {
    // For now, these are just operational "hooks"
    switch(event) {
      case NotificationEventType.APPOINTMENT_REQUESTED:
        // logic for email request acknowledgement
        break;
      case NotificationEventType.APPOINTMENT_CONFIRMED:
        // logic for WhatsApp confirmation
        break;
      case NotificationEventType.APPOINTMENT_RESCHEDULED:
        // logic for reschedule SMS
        break;
    }
  }
}
