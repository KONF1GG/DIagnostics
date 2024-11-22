import { useState } from "react";
import handleLogin from "../../API/login";

const Login = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null); 

const handleSubmit = async () => {
    setError(null); 

    const result = await handleLogin(username, password);
    

    if (typeof result === 'object' && 'token' in result) {
        localStorage.setItem("token", result.token);
        window.location.href = '/'; 
    } else {
        console.log(result); 
        setError(result); 
    }
};

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="card p-4 shadow-sm" style={{ width: '300px', borderRadius: '10px' }}>
        <h3 className='text-center mb-4 fs-4 fw-bold'>Авторизация</h3>
        
        {error && <div className="alert alert-danger">{error}</div>} 

        <input 
          type="text" 
          placeholder="Логин" 
          className="form-control mb-3" 
          style={{ borderRadius: '8px' }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        
        <input 
          type="password" 
          placeholder="Пароль" 
          className="form-control mb-4" 
          style={{ borderRadius: '8px' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <button 
          onClick={handleSubmit} 
          className="btn btn-primary w-100 mb-3" 
          style={{ borderRadius: '8px' }}
          disabled={!username || !password}
        >
          Войти
        </button>

        <a href="/register" className="text-center w-100" style={{ textDecoration: 'none' }}>
          Регистрация
        </a>
      </div>
    </div>
  );
}

export default Login;
