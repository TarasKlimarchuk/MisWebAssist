import { FC, TouchEvent, useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { Button, Card, Image } from 'antd';
import Meta from 'antd/lib/card/Meta';

import styles from './Document.module.css';

import { LoadingStatus } from '../../store/types';
import useStore from '../../hooks/useStore';
import {
  BottomButtons,
  DeleteDocumentModal,
  Loader,
  PatientInfo,
  PdfViewer,
} from '../../components';
import { isPdfFile } from '../../utils';

const Document: FC = () => {
  const params = useParams<{ patientID: string; documentID: string }>();
  const history = useHistory();
  const { documentsStore } = useStore();

  const blockRef = useRef<HTMLDivElement>(null);

  const [swipeWidth, setSwipeWidth] = useState(0);
  const [deleteDocumentModal, setDeleteDocumentModal] = useState(false);
  const [pdfFull, setPdfFull] = useState(false);

  useEffect(() => {
    if (
      !documentsStore.patient ||
      !documentsStore.chosen ||
      documentsStore.chosen.uuid !== params.documentID
    ) {
      (async () => {
        await documentsStore.getDocumentById(
          params.patientID,
          params.documentID
        );
      })();
    }
  }, [documentsStore.patient, params]);

  const handleTouch = (e: TouchEvent<HTMLDivElement>) => {
    if (!blockRef.current || pdfFull) {
      return false;
    }

    const pos = e.touches[0].clientX;

    blockRef.current.ontouchmove = (e) => {
      const mousePos = pos - e.touches[0].clientX;
      if (mousePos > 0) {
        setSwipeWidth(mousePos);
      }

      blockRef.current!.ontouchend = () => {
        setSwipeWidth(0);
        blockRef.current!.ontouchmove = null;
        blockRef.current!.ontouchend = null;
      };

      if (mousePos > blockRef.current!.clientWidth / 3) {
        blockRef.current!.ontouchmove = null;
        blockRef.current!.ontouchend = null;
      }
    };
  };

  return (
    <>
      {documentsStore.loadingStatus !== LoadingStatus.LOADING &&
      documentsStore.patient ? (
        documentsStore.chosen ? (
          <div className={styles.container}>
            <PatientInfo />
            <div
              ref={blockRef}
              style={
                !pdfFull
                  ? {
                      transform: `translateX(${-swipeWidth}px)`,
                      transition: 'all .3s',
                      position: 'relative',
                    }
                  : undefined
              }
              onTouchStart={handleTouch}
            >
              <Card
                className={styles.card}
                bordered={false}
                cover={
                  isPdfFile(documentsStore.chosen.url) ? (
                    <PdfViewer
                      isFull={pdfFull}
                      setIsFull={() => setPdfFull(true)}
                      onClose={() => setPdfFull(false)}
                      file={documentsStore.chosen.url}
                    />
                  ) : (
                    <Image
                      className={'image'}
                      width={'auto'}
                      alt={documentsStore.chosen.description.slice(0, 20)}
                      src={documentsStore.chosen.url}
                    />
                  )
                }
              >
                <Meta
                  title={documentsStore.chosen.date}
                  description={documentsStore.chosen.description}
                />
              </Card>

              {!pdfFull && (
                <div className={styles.buttons}>
                  <Button
                    className={styles.button}
                    onClick={() => setDeleteDocumentModal(true)}
                  >
                    Видалити
                  </Button>
                  <Button
                    className={styles.button}
                    onClick={() => {
                      history.push(
                        `/patients/${params.patientID}/documents/${params.documentID}/edit`
                      );
                    }}
                  >
                    Редагувати
                  </Button>
                </div>
              )}
            </div>

            <BottomButtons
              buttons={[
                {
                  title: 'Назад',
                  onClick: () => {
                    history.push(
                      `/patients/${documentsStore.patient!.patientID}/documents`
                    );
                  },
                },
              ]}
            />
          </div>
        ) : (
          <div>Документа не існує</div>
        )
      ) : (
        <Loader />
      )}

      <DeleteDocumentModal
        isOpen={deleteDocumentModal}
        onClose={() => setDeleteDocumentModal(false)}
      />
    </>
  );
};

export default observer(Document);
