import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

import getStarfield from "./src/getStarfield.js";
import { getFresnelMat } from "./src/getFresnelMat.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
scene.add(earthGroup);
new OrbitControls(camera, renderer.domElement);
const detail = 12;
const loader = new THREE.TextureLoader();
const geometry = new THREE.IcosahedronGeometry(1, detail);
const material = new THREE.MeshPhongMaterial({
  map: loader.load("./textures/00_earthmap1k.jpg"),
  specularMap: loader.load("./textures/02_earthspec1k.jpg"),
  bumpMap: loader.load("./textures/01_earthbump1k.jpg"),
  bumpScale: 0.04,
});

const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const lightsMat = new THREE.MeshBasicMaterial({
  map: loader.load("./textures/03_earthlights1k.jpg"),
  blending: THREE.AdditiveBlending,
});
const lightsMesh = new THREE.Mesh(geometry, lightsMat);
earthGroup.add(lightsMesh);

const cloudsMat = new THREE.MeshStandardMaterial({
  map: loader.load("./textures/04_earthcloudmap.jpg"),
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  alphaMap: loader.load('./textures/05_earthcloudmaptrans.jpg'),
  
});
const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
cloudsMesh.scale.setScalar(1.003);
earthGroup.add(cloudsMesh);

const fresnelMat = getFresnelMat();
const glowMesh = new THREE.Mesh(geometry, fresnelMat);
glowMesh.scale.setScalar(1.01);
earthGroup.add(glowMesh);

const stars = getStarfield({numStars: 2000});
scene.add(stars);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

function animate() {
  requestAnimationFrame(animate);

  earthMesh.rotation.y += 0.002;
  lightsMesh.rotation.y += 0.002;
  cloudsMesh.rotation.y += 0.0023;
  glowMesh.rotation.y += 0.002;
  stars.rotation.y -= 0.0002;
  renderer.render(scene, camera);
}

animate();

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);


document.addEventListener('DOMContentLoaded', () => {
  const chatboxWrapper = document.getElementById('chatbox-wrapper');
  const messageBox = document.getElementById('message-box');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  const mapSearchInput = document.getElementById('map-search-input');
  const mapSearchBtn = document.getElementById('map-search-btn');

  mapSearchBtn.addEventListener('click', () => {
    const searchQuery = mapSearchInput.value.trim();
    if (searchQuery) {
      updateMapLocation(searchQuery);
    }
  });

  mapSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const searchQuery = mapSearchInput.value.trim();
      if (searchQuery) {
        updateMapLocation(searchQuery);
      }
    }
  });

  function updateMapLocation(location) {
    const mapboxClient = mapboxSdk({ accessToken: mapboxgl.accessToken });
    mapboxClient.geocoding
      .forwardGeocode({
        query: location,
        limit: 1
      })
      .send()
      .then(response => {
        const match = response.body.features[0];
        if (match) {
          currentLocation = match.center;
          map.flyTo({
            center: currentLocation,
            zoom: 14
          });
          new mapboxgl.Marker().setLngLat(currentLocation).addTo(map);
        }
      });
  }

  if (!chatboxWrapper) {
    console.error('Chatbox wrapper not found in the DOM');
    return;
  }

  if (!messageBox) {
    console.error('Message box not found in the DOM');
    return;
  }

  if (!messageInput) {
    console.error('Message input not found in the DOM');
    return;
  }

  if (!sendButton) {
    console.error('Send button not found in the DOM');
    return;
  }

  sendButton.addEventListener('click', () => {
    if (messageInput.value.trim().length > 0) {
      sendMessage(messageInput.value.trim());
    }
  });

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim().length > 0) {
      sendMessage(messageInput.value.trim());
    }
  });

  

mapboxgl.accessToken = 'your_api_key_here';

let map;
let currentLocation;

document.getElementById('show-map-btn').addEventListener('click', showMap);
document.getElementById('close-map-btn').addEventListener('click', hideMap);

function showMap() {
    document.getElementById('map-container').style.display = 'block';
    if (!map) {
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-80.413940, 37.229572],  //Coordinates to zoom or change
            zoom: 15
        });
    }
    if (currentLocation) {
        map.flyTo({
            center: currentLocation,
            zoom: 17
        });
        new mapboxgl.Marker().setLngLat(currentLocation).addTo(map);
    }
}

function hideMap() {
    document.getElementById('map-container').style.display = 'none';
}

async function sendMessage(message) {
    displayMessage(message, 'user');
    
    try {
        const response = await fetch('http://localhost:8000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        const data = await response.json();
        displayMessage(data.response, 'bot');
        
        
        const locationMatch = message.match(/in\s+(.+)/i);
        if (locationMatch) {
            const location = locationMatch[1];
            updateMapLocation(location);
        }
    } catch (error) {
        console.error('Error:', error);
        displayMessage('Sorry, an error occurred.', 'bot');
    }
}

function updateMapLocation(location) {
    const mapboxClient = mapboxSdk({ accessToken: mapboxgl.accessToken });
    mapboxClient.geocoding
        .forwardGeocode({
            query: location,
            limit: 1
        })
        .send()
        .then(response => {
            const match = response.body.features[0];
            if (match) {
                currentLocation = match.center;
                document.getElementById('show-map-btn').style.display = 'block';
            }
        });
}

function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    if (sender === 'bot') {
        
        let formattedMessage = message.replace(/\n/g, '<br>');
        formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        messageElement.innerHTML = formattedMessage;
    } else {
        messageElement.textContent = message;
    }
    
    document.getElementById('message-box').appendChild(messageElement);
    messageElement.scrollIntoView({ behavior: 'smooth' });
}



  async function fetchResponse(message) {
    try {
      console.log('Sending message:', message);
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      if (data.error) {
        throw new Error(data.error);
      }
      displayMessage(data.response, 'bot');
      
      
      if (data.coordinates) {
        console.log('Coordinates:', data.coordinates);

      }
    } catch (error) {
      console.error('Error details:', error);
      displayMessage(`Sorry, I encountered an error. Details: ${error.message}`, 'bot');
    }
  }

  async function sendMessage(message) {
    displayMessage(message, 'user');
    
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
  
      const data = await response.json();
      displayMessage(data.response, 'bot');
    } catch (error) {
      console.error('Error:', error);
      displayMessage('Sorry, an error occurred.', 'bot');
    }
  }
  
  function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    if (sender === 'bot') {
      
      let formattedMessage = message.replace(/\n/g, '<br>');
      formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      messageElement.innerHTML = formattedMessage;
    } else {
      messageElement.textContent = message;
    }
    
    document.getElementById('message-box').appendChild(messageElement);
    messageElement.scrollIntoView({ behavior: 'smooth' });
  }
  
  
  document.getElementById('clearButton').addEventListener('click', async () => {
    try {
      await fetch('http://localhost:8000/clear', { method: 'POST' });
      document.getElementById('message-box').innerHTML = '';
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  });
  

  document.getElementById('sendButton').addEventListener('click', () => {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (message) {
      sendMessage(message);
      messageInput.value = '';
    }
  });
  
  
  document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const message = e.target.value.trim();
      if (message) {
        sendMessage(message);
        e.target.value = '';
      }
    }
  });
  
});
