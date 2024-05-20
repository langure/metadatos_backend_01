require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());


const port = process.env.PORT || 3000;
const databaseUrl = process.env.DATABASE_URL;

// Connect to MongoDB
mongoose.connect(databaseUrl)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

app.get('/test', (req, res) => {
  console.log("connecting to MongoDB... with db url: " + databaseUrl);
  if (mongoose.connection.readyState === 1) { 
    res.send('MongoDB connection is established');
  } else {
    res.status(500).send('MongoDB connection is not established'); 
  }
});

const Sistema = require('./models/Sistema'); 
const Documento = require('./models/Documento');
const Metadato = require('./models/Metadato');

app.get('/api/Sistemas/get', async (req, res) => {
  try {
    const sistemas = await Sistema.find();
    res.json(sistemas);
  } catch (error) {
    console.error('Error fetching sistemas:', error); // Log the error for debugging
    res.status(500).json({ error: 'Internal server error' }); // Generic error message for the client
  }
});

app.post('/api/Sistemas/create', async (req, res) => {
    try {
      const nuevoSistema = new Sistema({
        sistema: req.body.sistema,
        descripcion: req.body.descripcion,
      });
  
      const savedSistema = await nuevoSistema.save(); // Save to MongoDB
      res.status(201).json(savedSistema); // 201 Created status
    } catch (error) {
      console.error('Error creating sistema:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/Sistemas/update', async (req, res) => {
    try {
      const { sistema, nuevo_sistema, descripcion } = req.body;  
      const updatedSistema = await Sistema.findOneAndUpdate(
        { sistema }, // Filter by the original 'sistema' value
        { sistema: nuevo_sistema, descripcion }, // Update fields
        { new: true } // Return the updated document
      );
  
      if (!updatedSistema) {
        return res.status(404).json({ error: 'Sistema not found' });
      }
  
      res.json(updatedSistema);
    } catch (error) {
      console.error('Error updating sistema:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/Sistemas/delete', async (req, res) => {
    try {
      const { sistema } = req.body;
  
      const deletedSistema = await Sistema.findOneAndDelete({ sistema });
  
      if (!deletedSistema) {
        return res.status(404).json({ error: 'Sistema not found' });
      }
  
      res.json({ message: 'Sistema deleted successfully', deletedSistema }); 
    } catch (error) {
      console.error('Error deleting sistema:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/TiposDocumentos/create', async (req, res) => {
    try {
      const documentoData = req.body;
  
      // 1. Check if Sistema exists
      const sistema = await Sistema.findOne({ sistema: documentoData.sistemas[0].sistema });
      if (!sistema) {
        return res.status(400).json({ error: 'Sistema not found' });
      }
  
      // 2. Create Metadatos
      const metadatosIds = [];
      for (const metadatoData of documentoData.metadatos) {
        const newMetadato = new Metadato(metadatoData);
        const savedMetadato = await newMetadato.save();
        metadatosIds.push(savedMetadato._id);
      }
  
      // 3. Create Documento
      const newDocumento = new Documento({
        ...documentoData,
        sistemas: [sistema._id], 
        metadatos: metadatosIds,
      });
      const savedDocumento = await newDocumento.save();
  
      // 4. Populate and Respond
      const populatedDocumento = await Documento.findById(savedDocumento._id)
        .populate('sistemas')
        .populate('metadatos');
  
      res.status(201).json(populatedDocumento);
    } catch (error) {
      console.error('Error creating documento:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.delete('/api/TiposDocumentos/delete', async (req, res) => {
    try {
      const { tipo_objeto } = req.body;
  
      // 1. Find Referenced Metadatos
      const documento = await Documento.findOne({ tipo_objeto });
      if (!documento) {
        return res.status(404).json({ error: 'Documento not found' });
      }
      
      // 2. Delete Referenced Metadatos
      const deletedMetadatosResult = await Metadato.deleteMany({
        _id: { $in: documento.metadatos }
      });
  
      // 3. Delete Documento
      const deletedDocumento = await Documento.findOneAndDelete({ tipo_objeto });
  
      res.json({
        message: 'Tipo de documento and associated metadatos deleted successfully',
        deletedDocumento,
        deletedMetadatosResult,
      });
    } catch (error) {
      console.error('Error deleting tipo de documento:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  
  app.put('/api/TiposDocumentos/update', async (req, res) => {
    const tipoObjeto = req.tipo_objeto; // Define tipoObjeto here

    try {
      const updateData = req.body;
  
      // 1. Find the Documento
      let documento = await Documento.findOne({ tipoObjeto });
      if (!documento) {
        return res.status(404).json({ error: 'Documento not found' });
      }
  
      // 2. Update Referenced Sistemas
      const sistema = await Sistema.findOne({ sistema: updateData.sistemas[0].sistema });
      if (!sistema) {
        return res.status(400).json({ error: 'Sistema not found' });
      }
      documento.sistemas = [sistema._id];
  
      // 3. Update or Create Metadatos (and collect to-be-deleted IDs)
      const updatedMetadatosIds = [];
      const metadatosToDelete = [];
      for (const metadatoData of updateData.metadatos) {
        let metadato = await Metadato.findById(metadatoData.id_metadato); // Check if exists
  
        if (metadato) {
          // Update existing Metadato
          Object.assign(metadato, metadatoData); // Overwrite fields
          await metadato.save();
        } else {
          // Create new Metadato
          metadato = new Metadato(metadatoData);
          await metadato.save();
        }
        updatedMetadatosIds.push(metadato._id);
      }
  
      // Find Metadatos that were in the document but are not in the update data
      for (const existingMetadatoId of documento.metadatos) {
        if (!updatedMetadatosIds.includes(existingMetadatoId)) {
          metadatosToDelete.push(existingMetadatoId);
        }
      }
  
      // 4. Update Documento and Delete Removed Metadatos
      documento.tipo_documento = updateData.tipo_documento;
      documento.multiple = updateData.multiple;
      documento.metadatos = updatedMetadatosIds;
      const updatedDocumento = await documento.save(); 
  
      // Delete removed Metadatos
      await Metadato.deleteMany({ _id: { $in: metadatosToDelete } });
  
      // 5. Populate and Respond
      const populatedDocumento = await Documento.findById(updatedDocumento._id)
        .populate('sistemas')
        .populate('metadatos');
  
      res.json(populatedDocumento);
    } catch (error) {
      console.error('Error updating documento:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/TiposDocumentos/get', async (req, res) => {
    try {
      const documentos = await Documento.find()
        .populate('sistemas')
        .populate('metadatos');
  
      res.json(documentos);
    } catch (error) {
      console.error('Error fetching documentos:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });  

  app.post('/api/Metadatos/getbyid', async (req, res) => {
    try {
      const metadatoId = req.body.id_metadato;
      const objectId = mongoose.Types.ObjectId.createFromHexString(metadatoId);
      const metadato = await Metadato.findOne({ id_metadato: objectId });
  
      if (!metadato) {
        return res.status(404).json({ error: 'Metadato not found' });
      }
  
      res.json(metadato);
    } catch (error) {
      console.error('Error fetching metadato:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/Sistemas/getbyid', async (req, res) => {
    try {
      const sistemaId = req.body.id_sistema; // Get id_sistema from request body
      const objectId = mongoose.Types.ObjectId.createFromHexString(sistemaId);
      const sistema = await Sistema.findOne({ id_sistema: objectId });

      console.log("sistema: " + sistema);
  
      if (!sistema) {
        return res.status(404).json({ error: 'Sistema not found' });
      }
  
      res.json(sistema);
    } catch (error) {
      console.error('Error fetching sistema:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/TiposDocumentos/getbyid', async (req, res) => {
    try {
      const documentoId = req.body.id_tipo_documento; 
      const objectId = mongoose.Types.ObjectId.createFromHexString(documentoId);
      const documento = await Documento.findOne({ id_tipo_documento: objectId }).populate('sistemas').populate('metadatos');
  
      if (!documento) {
        return res.status(404).json({ error: 'Documento not found' });
      }
  
      res.json(documento);
    } catch (error) {
      console.error('Error fetching documento:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
