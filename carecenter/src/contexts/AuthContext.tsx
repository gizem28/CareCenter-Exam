// auth context for hele appen
// kullanıcı giriş durumunu tutar
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { AuthService } from "../api/authService";

interface User {
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// provider for auth - wrapper rundt hele appen
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // sjekk localstorage for token når app starter
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.email && userData.role) {
          setToken(storedToken);
          setUser(userData);
        } else {
          // slett ugyldig data
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // login funksjon - kaller api og lagrer token
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await AuthService.login(email, password);

      const userData: User = {
        email: response.email,
        fullName: response.fullName,
        role: response.role,
      };

      setToken(response.token);
      setUser(userData);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  // logg ut - fjern token og bruker fra localstorage
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
