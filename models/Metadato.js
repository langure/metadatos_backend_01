const mongoose = require('mongoose');

const metadatoSchema = new mongoose.Schema({
  id_metadato: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    index: true, // Optional index for faster lookups
  },
  llave: Boolean,
  campo: String,
  metadato: String,
  descripcion_campo: String,
  tipo_dato: String,
  longitud_dato: Number,
  ayuda_busqueda: String,
  formato: String,
  metadato_autorizacion: Boolean,
  frente: String,
  descripcion_homologada: String,
  tipo_objeto_autorizacion: String,
  ambito_objeto_autorizacion: String,
  obligatorio: Boolean,
});

const Metadato = mongoose.model('Metadato', metadatoSchema);

module.exports = Metadato;