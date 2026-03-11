"""
VaaniAI Memory Module — Citizen Conversation Memory

Stores and retrieves citizen interaction history using vector embeddings.
Enables "zero repeat context" — citizen never has to repeat themselves on callbacks.

Integrations:
- Supabase pgvector : Primary vector store (PostgreSQL-based)
- Pinecone          : Cloud vector DB alternative

Each citizen's history is stored by phone number and retrieved
semantically on new calls to inject context into the LLM prompt.
"""


class CitizenMemory:
    """
    Manages persistent citizen conversation memory using vector embeddings.
    """

    def __init__(self, db_url: str, embedding_model: str = "text-embedding-3-small"):
        self.db_url = db_url
        self.embedding_model = embedding_model
        # TODO: Initialize pgvector connection

    def store_conversation(self, phone_number: str, transcript: str, summary: str, metadata: dict):
        """
        Saves a call transcript + AI summary as a vector embedding.
        Keyed by phone number for fast citizen lookup.
        """
        # TODO: Embed transcript and upsert to pgvector
        pass

    def retrieve_history(self, phone_number: str, top_k: int = 3) -> list:
        """
        Retrieves the most relevant past conversations for a caller.
        Returns list of conversation summaries for LLM context injection.
        """
        # TODO: Vector similarity search by phone number
        pass

    def get_open_tickets(self, phone_number: str) -> list:
        """
        Returns all unresolved grievance tickets for a citizen.
        Used to give ticket status updates on callback.
        """
        # TODO: Query ticket status from database
        pass

    def build_context_prompt(self, phone_number: str) -> str:
        """
        Builds a context string to prepend to the LLM prompt.
        Example: 'This citizen last called on 5 March about a pothole on MG Road (Ticket #4521, status: In Progress).'
        """
        history = self.retrieve_history(phone_number)
        if not history:
            return "This is a new caller with no previous interactions."
        # TODO: Format history into natural language context
        pass
