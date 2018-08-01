import React from 'react';

import '../styles/Vote.css';

export default () => {
    return (
      <div>
        <p>Please vote on the current item using the buttons below:</p>
        <div>
        {[1,2,3,5,8,13,20,100].map(i => (
        <button type="button" className="btn btn-primary btn-lg">
          {i}
        </button>
        ))}
      </div>
    </div>
    );
}
