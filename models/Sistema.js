const mongoose = require('mongoose');

const sistemaSchema = new mongoose.Schema({
  id_sistema: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    index: true,
  },
  sistema: { type: String, required: true },
  descripcion: String 
});

const Sistema = mongoose.model('Sistema', sistemaSchema, 'sistemas');

module.exports = Sistema;
