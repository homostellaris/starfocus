import AppDemo from "./AppDemo";
import Layout from "../components/Layout";
import Button from "./Button";
import P from "./P";
import StatementLarge from "./StatementLarge";
import StatementSmall from "./StatementSmall";
import { useEffect } from "react";
import FeatureSpotlight from "./FeatureSpotlight";

export default function IndexPage() {
  useEffect(setupAnimations, []);

  return (
    <Layout title="Starfocus | The todo app for the future">
      <main>
        <section className="h-screen">
          <h1
            id="title"
            className="font-extralight text-6xl text-center text-white tracking-widest uppercase"
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
          <AppDemo />
        </section>
        <FeatureSpotlight id="what-is-starfocus" className="h-screen relative">
          <P>
            In this age of constant distraction and information overload we need
            more thoughtfully designed apps that learn what is important to us
            and help us to stay focused.
            <br />
            <br />A key design goal of Starfocus is to embrace our imperfect
            human nature. Rigid scheduling of todos is error-prone and
            demotivating. Never-ending backlogs of todos are anxiety-inducing.
            We prefer goal-setting, brain-dumping, and space exploration!
          </P>
        </FeatureSpotlight>
      </main>
    </Layout>
  );
}

function setupAnimations() {
  const whatIsStarfocus = document.getElementById("what-is-starfocus");
  let observer = new IntersectionObserver(
    (entries) => {
      const paragraph = document.querySelector("#what-is-starfocus p");
      if (entries[0].isIntersecting) paragraph.classList.remove("off-screen");
      else paragraph.classList.add("off-screen");
    },
    {
      threshold: 1.0,
    }
  );
  observer.observe(whatIsStarfocus);
}
