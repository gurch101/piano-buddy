import m from "mithril";
import "./App.css";
import Modal from "./Modal";

// the youtube player
let player;

/*
TODO:
pause video and get current time on click of add snapshot button, let user put in end time
click on segment to play segment in loop
one tap to play/pause video
full screen with toolbar
disable modal buttons during ajax call
save data to json file in s3 bucket
*/

interface Video {
  id: string;
  thumbnailUrl: string;
  title: string;
}

const videos: Video[] = [
  {
    title: "SIDEMEN STRENGTH TEST",
    thumbnailUrl: "https://i.ytimg.com/vi/XuSoqUO2kYs/hqdefault.jpg",
    id: "XuSoqUO2kYs",
  },
  {
    title: "SIDEMEN STRENGTH TEST",
    thumbnailUrl: "https://i.ytimg.com/vi/XuSoqUO2kYs/hqdefault.jpg",
    id: "XuSoqUO2kYs",
  },
  {
    title: "SIDEMEN STRENGTH TEST",
    thumbnailUrl: "https://i.ytimg.com/vi/XuSoqUO2kYs/hqdefault.jpg",
    id: "XuSoqUO2kYs",
  },
  {
    title: "SIDEMEN STRENGTH TEST",
    thumbnailUrl: "https://i.ytimg.com/vi/XuSoqUO2kYs/hqdefault.jpg",
    id: "XuSoqUO2kYs",
  },
  {
    title: "SIDEMEN STRENGTH TEST",
    thumbnailUrl: "https://i.ytimg.com/vi/XuSoqUO2kYs/hqdefault.jpg",
    id: "XuSoqUO2kYs",
  },
];

const Navbar = {
  view: () => (
    <div className="navbar">
      <span>🎹</span> Piano Buddy
    </div>
  ),
};

interface AddVideoModalProps {
  addVideo: (video: Video) => void;
  onClose: () => void;
}

interface YoutubeApiResponse {
  thumbnail_url: string;
  title: string;
}
const AddVideoModal: m.ClosureComponent<AddVideoModalProps> = (vnode) => {
  let url = "";
  let error = false;

  async function addVideoAndClose(e) {
    e.preventDefault();
    if (url.trim() === "") {
      error = true;
    } else if (url.indexOf("youtube") <= 0 || url.indexOf("v=") <= 0) {
      error = true;
    } else {
      // TODO parse id
      const theUrl = new URL(url);
      const videoId = theUrl.searchParams.get("v");
      const response: YoutubeApiResponse = await m.request({
        method: "GET",
        url: `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`,
      });

      vnode.attrs.addVideo({
        id: videoId as string,
        thumbnailUrl: response.thumbnail_url,
        title: response.title,
      });
      vnode.attrs.onClose();
    }
  }

  function onUrlChange(e) {
    url = e.target.value;
    error = false;
  }

  return {
    oncreate: () => {
      (document.querySelector("input[name='url']") as HTMLElement)!.focus();
    },
    view: (vnode) => {
      return (
        <Modal title="Add a video" onClose={vnode.attrs.onClose}>
          <form>
            <div className="form-body">
              <label for="url">Enter a Youtube URL</label>
              <input
                className={error ? "error" : ""}
                name="url"
                type="text"
                value={url}
                oninput={onUrlChange}
              />
              {error && (
                <div className="error-text">
                  Please enter a valid youtube URL
                </div>
              )}
            </div>
            <div className="modal-actions">
              <input type="submit" value="Add" onclick={addVideoAndClose} />
              <button
                onclick={(e) => {
                  e.preventDefault();
                  vnode.attrs.onClose();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      );
    },
  };
};

interface PlaylistItemProps {
  id: string;
  thumbnail: string;
  title: string;
  onSelect: (id: string) => void;
}

const PlaylistItem: m.Component<PlaylistItemProps> = {
  view: (vnode) => {
    return (
      <div
        className="list-item"
        onclick={(e) => vnode.attrs.onSelect(vnode.attrs.id)}
      >
        <img src={vnode.attrs.thumbnail} />
        <p>{vnode.attrs.title}</p>
      </div>
    );
  },
};

interface PlaylistProps {
  playVideo: (id: string) => void;
}

const Playlist: m.ClosureComponent<PlaylistProps> = () => {
  let showAddVideoModal = false;

  function toggleVideoModal() {
    showAddVideoModal = !showAddVideoModal;
  }

  function addVideo(video: Video) {
    videos.push(video);
  }

  return {
    view: (vnode) => {
      return (
        <div className="playlist">
          <div className="header">
            <h3>Playlist</h3>
            <button onclick={toggleVideoModal}>+ Add a video</button>
          </div>
          <div className="list">
            {videos.map((video) => (
              <PlaylistItem
                key={video.id}
                id={video.id}
                thumbnail={video.thumbnailUrl}
                title={video.title}
                onSelect={vnode.attrs.playVideo}
              />
            ))}
          </div>
          {showAddVideoModal && (
            <AddVideoModal onClose={toggleVideoModal} addVideo={addVideo} />
          )}
        </div>
      );
    },
  };
};

interface PlayerProps {
  videoId: string;
  playImmediately: boolean;
}

const Player: m.ClosureComponent<PlayerProps> = (vnode) => {
  let videoId = vnode.attrs.videoId;
  let playImmediately = vnode.attrs.playImmediately;

  function onPlayerReady() {
    if (playImmediately) {
      player.playVideo();
    }
  }

  function onPlayerStateChange(e) {
    console.log(e.data);
  }

  return {
    oncreate: () => {
      player = new YT.Player("player-container", {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    },
    onupdate: (vnode) => {
      player.cueVideoById(videoId);
      setTimeout(() => onPlayerReady(), 100);
    },
    onbeforeupdate: (vnode, old) => {
      if (
        old.attrs.videoId !== vnode.attrs.videoId ||
        old.attrs.playImmediately !== vnode.attrs.playImmediately
      ) {
        videoId = vnode.attrs.videoId;
        playImmediately = vnode.attrs.playImmediately;
        return true;
      }
      return false;
    },
    view: () => {
      return <div id="player-container"></div>;
    },
  };
};

interface AddSnapshotModalProps {
  onClose: () => void;
}

const AddSnapshotModal: m.ClosureComponent<AddSnapshotModalProps> = () => {
  return {
    view: (vnode) => {
      return (
        <Modal title="Add a snapshot" onClose={vnode.attrs.onClose}></Modal>
      );
    },
  };
};
const Snapshots = () => {
  let showSnapshotModal = false;
  let currentTime = "";
  function toggleSnapshotModal() {
    showSnapshotModal = true;
    currentTime = player.getCurrentTime();
    player.pauseVideo();
  }

  return {
    view: () => {
      return (
        <div className="snapshots">
          <div className="header">
            <h3>Snapshots</h3>
            <button onclick={toggleSnapshotModal}>+ Add a snapshot</button>
          </div>
          {showSnapshotModal && (
            <AddSnapshotModal onClose={() => (showSnapshotModal = false)} />
          )}
        </div>
      );
    },
  };
};

export const App = () => {
  let currentVideoId = videos.length > 0 ? videos[0].id : "";
  let playImmediately = false;

  function playVideo(id: string) {
    console.log("PLAY VIDEO!");
    currentVideoId = id;
    playImmediately = true;
  }

  // Local state ...
  return {
    view: () => {
      return (
        <div className="app">
          <Navbar />
          <div className="player">
            <Player
              videoId={currentVideoId}
              playImmediately={playImmediately}
            />
          </div>
          <Playlist playVideo={playVideo} />
          <Snapshots />
        </div>
      );
    },
  };
};
