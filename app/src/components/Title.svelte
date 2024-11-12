<div>
  <span></span>
  <span><slot /></span>
  <span></span>
</div>

<style>
div {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

span {
  text-transform: uppercase;
  font-size: 28px;
  white-space: nowrap;
  opacity: 0.5;
}
</style>
