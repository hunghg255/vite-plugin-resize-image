import './App.css';

import a from './assets/images/a.jpeg';
import b from './assets/images/b.png';

function App() {
  return (
    <div className='App'>
      <img src='/images/a.jpeg' alt='a' />
      <img src='/images/b.png' alt='a' />

      <img src={a} alt='' />
      <img src={b} alt='' />
    </div>
  );
}

export default App;
