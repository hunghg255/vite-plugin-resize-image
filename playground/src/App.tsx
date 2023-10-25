import './App.css';

import a from './assets/images/a.jpeg';
import b from './assets/images/b.png';

function App() {
  return (
    <div className="App">
      <img src="/images/a.jpeg" alt="a" />
      <img src="/images/b.png" alt="a" />

      <img src={a} alt="" />
      <img src={b} alt="" />

      <div
        style={{
          backgroundImage: `url(${a})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100px',
          height: '100px',
        }}
      ></div>
      <div
        style={{
          backgroundImage: `url('/images/a.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100px',
          height: '100px',
        }}
      ></div>
      <div className="img"></div>
    </div>
  );
}

export default App;
