import mongoose from 'mongoose'

const galonSchema = new mongoose.Schema(
    {
        nama: {
            type: String,
            required: true,
        },
        tempat: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Galon = mongoose.model('Galon', galonSchema);

export default Galon;