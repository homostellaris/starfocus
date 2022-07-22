export default function P(props) {
  return (
    <p
      id={props.id}
      className="text-white text-justify transition-all mx-auto my-2 max-w-prose absolute top-56 left-0 right-0"
    >
      {props.children}
    </p>
  );
}
