import React from 'react';
import { useSelector } from 'react-redux';
import Vote from './Vote';
import Results from './Results';

export default function GamePane() {
  const voted = useSelector(state => state.voted);
  return voted ? <Results /> : <Vote />;
}
