import React from 'react'

const Search = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="search">{searchTerm}
      <div>
        <img src="search.svg" alt="search" />
        <input type="text" placeholder="Search through Movies and TV Shows"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
    </div>
  )
}

export default Search;