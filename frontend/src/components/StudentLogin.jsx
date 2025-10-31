// src/components/StudentLoginResponsive.jsx
import { useState, useRef } from 'react';
import { useStudentAuth } from '../hooks/useStudentAuth';

const StudentLoginResponsive = () => {
  const { login, loading, error, isAuthenticated } = useStudentAuth();
  const [values, setValues] = useState(['', '', '', '', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const updated = [...values];
    updated[index] = value;
    setValues(updated);

    if (value && index < values.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formatted = `${values.slice(0, 5).join('')}-${values.slice(5, 7).join('')}-${values.slice(7, 9).join('')}`;
    const result = await login(formatted);
    if (result.success) {
      console.log('Connexion réussie:', formatted);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Déjà connecté</h2>
          <p className="text-gray-600 mb-6">Vous êtes déjà authentifié au portail captif.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Actualiser la page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Portail Captif</h1>
          <p className="text-gray-600">Authentification Étudiante</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Numéro de Matricule (format 00000-00-00)
            </label>

            <div className="flex justify-center items-center flex-wrap gap-2">
              {values.map((v, i) => (
                <div key={i} className="flex items-center">
                  <input
                    type="text"
                    maxLength="1"
                    value={v}
                    onChange={(e) => handleChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    ref={(el) => (inputRefs.current[i] = el)}
                    className={`w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 text-center text-lg sm:text-xl border rounded-lg 
                      font-mono focus:ring-2 focus:ring-blue-500 transition-all duration-150
                      ${error ? 'border-red-500 ring-red-200' : 'border-gray-300'}
                    `}
                  />
                  {(i === 4 || i === 6) && (
                    <span className="mx-1 sm:mx-2 text-xl font-bold text-gray-400">-</span>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-3 text-sm text-gray-500 text-center">
              Exemple : 12345-67-89
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-center text-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || values.includes('')}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition duration-200
              ${loading || values.includes('')
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-0.5'}`}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Système d'authentification sécurisé - Portail Captif Université
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLoginResponsive;
