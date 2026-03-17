// RECENTLY CHANGED: Completely overhauled the templates to reflect the ClinicOS B2B SaaS offering.
// Removed the old 'job', 'build', and 'build_plus' statuses and replaced them solely with 'message'.
// Removed the [AI_HOOK] and personal portfolio links.

export const TEMPLATES = {
  email: {
    // RECENTLY CHANGED: Targets the new 'message' status for email outreach
    message: {
      build: (name) => `Hi ${name} Team,

We are the team behind ClinicOS, a platform designed to completely automate your clinic's appointment booking directly through WhatsApp.

We know front desks spend hours taking phone calls and manually scheduling patients. With ClinicOS, patients simply message your clinic's WhatsApp number, and our conversational bot seamlessly guides them through booking, rescheduling, or canceling—24/7. 

Everything syncs instantly to a professional web dashboard and your Google Calendar, eliminating double-bookings and manual data entry.

Would you be open to a quick 5-minute chat to see how this could save your staff hours of work each week?

Best regards,
The ClinicOS Team`
    }
  },

  whatsapp: {
    // RECENTLY CHANGED: Targets the new 'message' status for WhatsApp outreach
    message: {
      build: (name) => `Hi ${name} team 👋

We're the team behind ClinicOS! We help clinics automate their appointment booking directly through WhatsApp. 

Instead of answering calls all day, your patients can just message your WhatsApp number to seamlessly book, reschedule, or cancel 24/7. Everything automatically syncs to a clean doctor dashboard and your Google Calendar. 🗓️

Would you be open to a quick 5-minute demo to see how it works for your clinic?`
    }
  }
};