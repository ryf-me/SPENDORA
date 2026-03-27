async function test() {
  const req = await fetch('http://localhost:3000/api/ai-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello' })
  });
  console.log('Status:', req.status);
  const text = await req.text();
  console.log('Response:', text);
}
test();
