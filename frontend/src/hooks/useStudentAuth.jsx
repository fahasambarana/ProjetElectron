// src/hooks/useStudentAuth.js
import { useState, useEffect } from 'react';
import { studentAuthService, matriculeUtils } from '../services/studentAuthService';

export const useStudentAuth = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('studentToken');
      const storedStudent = localStorage.getItem('studentData');

      if (token && storedStudent) {
        try {
          const verification = await studentAuthService.verify();
          if (verification.success && verification.valid) {
            setStudent(JSON.parse(storedStudent));
          } else {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (matricule) => {
    setLoading(true);
    setError('');

    try {
      // Validation du format
      if (!matriculeUtils.validate(matricule)) {
        throw new Error('Format de matricule invalide. Utilisez: 00000-00-00');
      }

      const result = await studentAuthService.login(matricule);

      if (result.success) {
        localStorage.setItem('studentToken', result.token);
        localStorage.setItem('studentData', JSON.stringify(result.data));
        setStudent(result.data);
        return { success: true };
      } else {
        throw new Error(result.error || 'Erreur d\'authentification');
      }
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    studentAuthService.logout();
    setStudent(null);
    setError('');
  };

  return {
    student,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!student
  };
};