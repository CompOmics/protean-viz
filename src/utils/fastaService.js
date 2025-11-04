export const getSequence = async(accession) =>{
  const url = 'https://rest.uniprot.org/uniprotkb/' + accession + '.fasta';
  let sequence = ''
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    } 
    const response_text = await response.text()
    sequence = parseFastaFileContent(response_text)
    console.log('json', sequence)
  } catch (error) {
    console.error(error.message)
  }
  return sequence
}

export const parseFastaFileContent = (fileContent) => {
  let sequence = ''
  const lines = fileContent.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('>')) {
      sequence += lines[i]
    }
  }
  return sequence
}