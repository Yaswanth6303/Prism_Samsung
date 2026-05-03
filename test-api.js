// Test script to call the sync endpoint and see what happens
async function testSync() {
  console.log('Calling /api/platform/sync...')
  try {
    const res = await fetch('http://localhost:3000/api/platform/sync', {
      method: 'POST',
    })
    const data = await res.json()
    console.log('Response status:', res.status)
    console.log('Response JSON:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

testSync()
