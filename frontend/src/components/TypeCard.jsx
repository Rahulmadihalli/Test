function TypeCard({ type }) {
  return (
    <article className="type-card">
      <h3>{type.name}</h3>
      <p>{type.description}</p>
    </article>
  );
}

export default TypeCard;

