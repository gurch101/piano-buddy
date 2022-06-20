import m from "mithril";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: m.Vnode[];
}

export default function Modal(): m.Component<ModalProps> {
  return {
    view: (vnode) => {
      return (
        <div className="modal">
          <div className="modal-header">
            <h3>{vnode.attrs.title}</h3>
            <button className="close" onclick={vnode.attrs.onClose}></button>
          </div>
          {vnode.children}
        </div>
      );
    },
  };
}
