import { useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext.jsx';

  export default function SessionGuard() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      const handler = () => { logout(); navigate('/', { replace: true }); };
      window.addEventListener('auth:session-expired', handler);
      return () => window.removeEventListener('auth:session-expired', handler);
    }, [logout, navigate]);

    return null;
  }