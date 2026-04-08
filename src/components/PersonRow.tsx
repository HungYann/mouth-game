import React from 'react'
import Person from './Person'

interface PersonState {
  index: number
  isMouthOpen: boolean
  isPlayer: boolean
}

interface PersonRowProps {
  persons: PersonState[]
  label: string
}

function PersonRow({ persons, label }: PersonRowProps) {
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#f3f0ed',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    minWidth: '400px'
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '8px'
  }

  const personsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    alignItems: 'center'
  }

  return (
    <div style={rowStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={personsContainerStyle}>
        {persons.map(person => (
          <Person
            key={person.index}
            index={person.index}
            isMouthOpen={person.isMouthOpen}
            isPlayer={person.isPlayer}
          />
        ))}
      </div>
    </div>
  )
}

export default PersonRow
