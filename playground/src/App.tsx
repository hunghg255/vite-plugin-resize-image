// import './App.css';

import a from './assets/a.jpeg';
// import a1 from './assets/folder1/a1.jpeg';
// import a2 from './assets/folder1/folder2/a2.jpeg';
// import b from './assets/images/b.png';

function App() {
  return (
    <div className="App">
      <img src="/images/a.svg" alt="a" />
      {/* <img src="/images/folder1/a1.jpeg" alt="a" />
      <img src="/images/folder1/folder2/a2.jpeg" alt="a" /> */}
      <img src="/images/a.jpeg" alt="a" />

      <img src={a} alt="" />
      {/* <img src={a1} alt="" />
      <img src={a2} alt="" /> */}
      {/*<img src={b} alt="" />

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
      <div className="img"></div> */}
    </div>
  );
}

export default App;
