const { exec } = require('child_process');

exports.executeSyncScript = (req, res) => {
  exec('//home/fahasambarana/projet-electron/testbdd.sh', (error, stdout, stderr) => {
    if (error) {
      console.error('Erreur script sync:', error);
      return res.status(500).json({ success: false, message: 'Erreur lors de la synchronisation', error: error.message });
    }
    res.json({ success: true, message: 'Synchronisation terminée', output: stdout });
  });
};
