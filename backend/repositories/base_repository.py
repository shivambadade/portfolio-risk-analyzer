from pymongo import ReturnDocument
from database.connection import counters_collection

class BaseRepository:
    @staticmethod
    def _get_next_sequence(name):
        counter = counters_collection.find_one_and_update(
            {"_id": name},
            {"$inc": {"sequence_value": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return counter["sequence_value"]
