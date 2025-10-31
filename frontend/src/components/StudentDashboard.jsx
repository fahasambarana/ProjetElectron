// components/StudentDashboard.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAuthService } from '../services/studentAuthService';

const StudentDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier que l'étudiant est bien connecté
    const checkAuth = async () => {
      try {
        const verification = await studentAuthService.verify();
        if (!verification.success || !verification.valid) {
          navigate('/student');
        }
      } catch (error) {
        navigate('/student');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    studentAuthService.logout();
    navigate('/student');
  };

  const studentData = JSON.parse(localStorage.getItem('studentData') || '{}');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Portail Étudiant</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Déconnexion
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Profil Étudiant</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Matricule:</span>
                  <p className="text-lg font-mono">{studentData.matricule}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Nom:</span>
                  <p className="text-lg">{studentData.nom}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Niveau:</span>
                  <p className="text-lg">{studentData.niveau}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">Accès Internet</h2>
              <p className="text-gray-700 mb-4">Vous êtes maintenant connecté au réseau.</p>
              <button
                onClick={() => window.open('https://www.google.com', '_blank')}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition duration-200"
              >
                🌐 Accéder à Internet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;