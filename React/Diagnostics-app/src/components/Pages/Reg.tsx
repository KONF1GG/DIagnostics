import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Reg from "../../API/Reg";

const Register = () => {
  const navigate = useNavigate(); 
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validatePasswords = (pass: string, confirmPass: string) => {
    if (pass !== confirmPass) {
      setErrorMessage('Пароли не совпадают');
    } else {
      setErrorMessage(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePasswords(newPassword, confirmPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    validatePasswords(password, newConfirmPassword);
  };

  const handleSubmit = async () => {
    if (password !== confirmPassword) return;

    const result = await Reg(username, password);

    if (typeof result === "string") {
      setErrorMessage(result);
      setSuccessMessage(null);
    } else {
      setSuccessMessage('Регистрация прошла успешно!');
      setErrorMessage(null);
      navigate("/login"); 
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="card p-4 shadow-sm" style={{ width: '300px', borderRadius: '10px' }}>
        <h3 className='text-center mb-4 fs-4 fw-bold'>Регистрация</h3>
        
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
          className="form-control mb-3" 
          style={{ borderRadius: '8px' }}
          value={password} 
          onChange={handlePasswordChange}
        />

        <input 
          type="password" 
          placeholder="Подтвердите пароль" 
          className="form-control mb-4" 
          style={{ borderRadius: '8px' }}
          value={confirmPassword} 
          onChange={handleConfirmPasswordChange}
        />

        {errorMessage && (
          <p className="text-danger text-center">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="text-success text-center">{successMessage}</p>
        )}
        
        <button 
          onClick={handleSubmit} 
          className="btn btn-primary w-100 mb-3" 
          style={{ borderRadius: '8px' }}
          disabled={password !== confirmPassword || !password || !confirmPassword}
        >
          Зарегистрироваться
        </button>

        <a href="/login" className="text-center w-100" style={{ textDecoration: 'none' }}>
          Уже есть аккаунт? Войти
        </a>
      </div>
    </div>
  );
}

export default Register;
