import Layout from "../components/Layout";
import Button from "./Button";
import StatementLarge from "./StatementLarge";
import StatementSmall from "./StatementSmall";

const IndexPage = () => (
  <Layout title="Starfocus | The todo app for the future">
    {/* <div className="supernova w-screen h-screen fixed"></div> */}
    <main>
    <h1
      id="title"
      className="font-extralight text-6xl text-center text-white tracking-widest uppercase p-5"
    >
      <span>Starfocus</span> {/* Find out why this has a weird margin. */}
    </h1>
      <div className="flex justify-center items-center flex-wrap">
        <span className="w-80 text-center border-b">
          <StatementSmall>Avoid earthly distractions</StatementSmall>
        </span>
        <img src="/logo.png" className="w-32"></img>
        <span className="w-80 text-center border-b">
          <StatementSmall>Stay focused</StatementSmall>
        </span>
      </div>
      <h2 className="text-center">
        <StatementLarge>Aim for the stars</StatementLarge>
      </h2>
      <div className="text-center m-4">
        <p className="text-slate-400 m-4">Beta coming soon</p>
        <Button className="text-white text-center">Register</Button>
      </div>
      <p className="hint font-light text-xl text-white text-center m-4">
        Scroll up or use the arrow keys to learn more
      </p>
    </main>
  </Layout>
);

export default IndexPage;
