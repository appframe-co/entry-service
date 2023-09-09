import { TEntryModel } from "@/types/types";
import mongoose, { Schema, Document } from "mongoose";

const ObjectId = Schema.ObjectId;

const DocSchema: Schema = new Schema({}, { strict: false });
DocSchema.set('toObject', { virtuals: true });
DocSchema.set('toJSON', { virtuals: true });

const EntriesSchema: Schema = new Schema({
    projectId: {
        type: ObjectId,
        require: true
    },
    structureId: {
        type: ObjectId,
        require: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    createdBy: {
        type: ObjectId,
        required: true
    },
    updatedBy: {
        type: ObjectId,
        required: true
    },
    doc: DocSchema
});

EntriesSchema.set('toObject', { virtuals: true });
EntriesSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Entries || mongoose.model < TEntryModel & Document > ("Entries", EntriesSchema);