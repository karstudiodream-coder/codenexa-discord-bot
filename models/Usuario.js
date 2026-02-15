import { Schema, model } from 'mongoose';

const usuarioSchema = new Schema({
    id: { type: String, required: true, unique: true },
    minutos_mes: { type: Number, default: 0 },
    puntos_totales: { type: Number, default: 0 }
});

export default model('Usuario', usuarioSchema);