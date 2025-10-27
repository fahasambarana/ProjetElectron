// src/components/RegisterForm.js
import React, { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield
} from "lucide-react";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!acceptTerms) {
      setError("Veuillez accepter les conditions d'utilisation");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/register", { username, email, password });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Carte d'inscription */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* En-tête */}
          <div className="text-center mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="absolute left-8 top-8 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Créer un compte
            </h1>
            <p className="text-white/70 text-sm">
              Rejoignez notre communauté dès maintenant
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Champ Nom d'utilisateur */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-white/80">
                <User className="h-4 w-4 mr-2" />
                Nom d'utilisateur
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Votre nom d'utilisateur"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 pl-12"
                />
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              </div>
            </div>

            {/* Champ Email */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-white/80">
                <Mail className="h-4 w-4 mr-2" />
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 pl-12"
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-white/80">
                <Lock className="h-4 w-4 mr-2" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Créez un mot de passe sécurisé"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 pl-12 pr-12"
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Indicateur de force du mot de passe */}
              {password && (
                <div className="space-y-2 p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Force du mot de passe</span>
                    <span className={`font-medium ${
                      strengthScore >= 4 ? 'text-green-400' : 
                      strengthScore >= 3 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {strengthScore >= 4 ? 'Fort' : strengthScore >= 3 ? 'Moyen' : 'Faible'}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        strengthScore >= 4 ? 'bg-green-500' : 
                        strengthScore >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(strengthScore / 5) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-white/60">
                    <div className={`flex items-center ${passwordStrength.length ? 'text-green-400' : ''}`}>
                      <div className={`w-1 h-1 rounded-full mr-2 ${passwordStrength.length ? 'bg-green-400' : 'bg-white/30'}`} />
                      ≥ 8 caractères
                    </div>
                    <div className={`flex items-center ${passwordStrength.uppercase ? 'text-green-400' : ''}`}>
                      <div className={`w-1 h-1 rounded-full mr-2 ${passwordStrength.uppercase ? 'bg-green-400' : 'bg-white/30'}`} />
                      Majuscule
                    </div>
                    <div className={`flex items-center ${passwordStrength.lowercase ? 'text-green-400' : ''}`}>
                      <div className={`w-1 h-1 rounded-full mr-2 ${passwordStrength.lowercase ? 'bg-green-400' : 'bg-white/30'}`} />
                      Minuscule
                    </div>
                    <div className={`flex items-center ${passwordStrength.number ? 'text-green-400' : ''}`}>
                      <div className={`w-1 h-1 rounded-full mr-2 ${passwordStrength.number ? 'bg-green-400' : 'bg-white/30'}`} />
                      Chiffre
                    </div>
                    <div className={`flex items-center ${passwordStrength.special ? 'text-green-400' : ''}`}>
                      <div className={`w-1 h-1 rounded-full mr-2 ${passwordStrength.special ? 'bg-green-400' : 'bg-white/30'}`} />
                      Caractère spécial
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Champ Confirmation mot de passe */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-white/80">
                <Shield className="h-4 w-4 mr-2" />
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 pl-12 pr-12"
                />
                <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            {/* Checkbox Conditions */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <div className="relative mt-1">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                  acceptTerms 
                    ? 'bg-green-500 border-green-500' 
                    : 'bg-white/5 border-white/20'
                }`}>
                  {acceptTerms && (
                    <CheckCircle2 className="h-4 w-4 text-white absolute -top-0.5 -left-0.5" />
                  )}
                </div>
              </div>
              <span className="text-white/70 text-sm flex-1">
                J'accepte les{" "}
                <a href="#" className="text-green-300 hover:text-green-200 underline">
                  conditions d'utilisation
                </a>{" "}
                et la{" "}
                <a href="#" className="text-green-300 hover:text-green-200 underline">
                  politique de confidentialité
                </a>
              </span>
            </label>

            {/* Messages d'état */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 p-3 bg-green-500/20 border border-green-500/30 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-200 text-sm font-medium">Inscription réussie !</p>
                  <p className="text-green-200/80 text-xs">Redirection vers la page de connexion...</p>
                </div>
              </div>
            )}

            {/* Bouton d'inscription */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Création du compte...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  <span>Créer mon compte</span>
                </>
              )}
            </button>

            {/* Lien vers connexion */}
            <div className="text-center">
              <p className="text-white/60 text-sm">
                Déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-green-300 hover:text-green-200 font-medium underline"
                >
                  Se connecter
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;