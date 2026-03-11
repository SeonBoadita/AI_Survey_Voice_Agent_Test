"""
VaaniAI Channels Module — Multi-Channel Citizen Communication

Supported Channels:
- WhatsApp   : Photo/video evidence upload post-call
- SMS        : Ticket confirmation and status updates
- Missed Call : Auto-callback on missed call (works on any phone, no app needed)

All channels feed into the same unified citizen record and ticket system.
"""


class WhatsAppChannel:
    """
    WhatsApp integration for post-call evidence submission.
    After a grievance call, citizen receives a WhatsApp link
    to attach photo/video proof to their ticket.
    """

    def __init__(self, api_key: str, phone_number_id: str):
        self.api_key = api_key
        self.phone_number_id = phone_number_id

    def send_evidence_link(self, citizen_phone: str, ticket_id: str):
        """
        Sends a WhatsApp message with a unique upload link.
        Citizen can attach photos/videos to their grievance ticket.
        """
        # TODO: WhatsApp Business API message send
        pass

    def receive_media(self, webhook_payload: dict) -> dict:
        """
        Handles incoming media (photo/video) from WhatsApp webhook.
        Returns: { ticket_id, media_url, media_type }
        """
        # TODO: Parse WhatsApp webhook and store media
        pass


class SMSChannel:
    """SMS Gateway for ticket confirmations and status updates."""

    def send_ticket_confirmation(self, phone: str, ticket_id: str, issue: str):
        """Sends SMS confirmation after grievance is registered."""
        # TODO: SMS gateway integration
        pass

    def send_status_update(self, phone: str, ticket_id: str, status: str):
        """Notifies citizen of ticket status change via SMS."""
        # TODO: SMS gateway integration
        pass


class MissedCallTracker:
    """
    Missed Call Status Service.
    Citizen gives a missed call → system auto-callbacks with ticket status.
    Works on any phone (no smartphone or app required).
    """

    def __init__(self, twilio_client):
        self.twilio = twilio_client

    def handle_missed_call(self, from_number: str):
        """
        Triggered when a missed call is detected.
        Initiates outbound callback with automated ticket status update.
        """
        # TODO: Lookup open tickets and initiate callback
        pass
