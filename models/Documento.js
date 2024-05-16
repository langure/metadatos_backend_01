const mongoose = require('mongoose');
const Sistema = require('./Sistema'); // Import your Sistema model
const Metadato = require('./Metadato'); // Import your Metadato model

const documentoSchema = new mongoose.Schema({
  id_tipo_documento: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    index: true,
  },
  tipo_documento: String,
  tipo_objeto: String,
  metadatos: [{type: mongoose.Schema.Types.ObjectId, ref: 'Metadato'}], // Reference to Metadato model
  multiple: Boolean,
  sistemas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sistema' }] // Reference to Sistema model
});

const Documento = mongoose.model('Documento', documentoSchema);

module.exports = Documento;
