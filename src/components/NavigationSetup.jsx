import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { setNavigate } from '../utils/navigation';

export default function NavigationSetup() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return null;
}